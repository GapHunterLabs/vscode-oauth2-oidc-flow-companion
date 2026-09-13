import * as vscode from 'vscode';
import { generateCodeVerifier, computeCodeChallengeS256, buildAuthorizationUrl } from './pkce';
import { decodeIdToken, JwtDecodeError } from './jwtDecode';
import { recordHit } from './reviewPrompt';

function getWebviewHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); }
  h2 { font-size: 14px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 6px; }
  label { display: block; margin-top: 8px; font-size: 12px; font-weight: 600; }
  input, textarea { width: 100%; box-sizing: border-box; margin-top: 3px; padding: 5px;
    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border); font-family: var(--vscode-editor-font-family); font-size: 12px; }
  textarea { min-height: 60px; }
  button { margin-top: 10px; padding: 6px 14px; background: var(--vscode-button-background);
    color: var(--vscode-button-foreground); border: none; cursor: pointer; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  pre { white-space: pre-wrap; word-break: break-all; background: var(--vscode-textCodeBlock-background);
    padding: 8px; border-radius: 4px; font-size: 12px; }
  .section { margin-bottom: 24px; }
</style>
</head>
<body>
  <div class="section">
    <h2>1. Build an authorization URL (PKCE)</h2>
    <button id="genVerifier">Generate code_verifier + code_challenge</button>
    <div id="verifierOut"></div>

    <label for="endpoint">Authorize endpoint</label>
    <input id="endpoint" placeholder="https://accounts.example.com/oauth/authorize" />
    <label for="clientId">client_id</label>
    <input id="clientId" />
    <label for="redirectUri">redirect_uri</label>
    <input id="redirectUri" placeholder="http://localhost:3000/callback" />
    <label for="scope">scope</label>
    <input id="scope" placeholder="openid profile email" />
    <label for="state">state</label>
    <input id="state" placeholder="(optional, but recommended)" />
    <button id="buildUrl">Build authorization URL</button>
    <div id="urlOut"></div>
  </div>

  <div class="section">
    <h2>2. Decode an ID token</h2>
    <label for="idToken">ID token (JWT)</label>
    <textarea id="idToken" placeholder="eyJhbGciOiJSUzI1NiJ9..."></textarea>
    <button id="decode">Decode</button>
    <div id="decodeOut"></div>
  </div>

<script>
  const vscode = acquireVsCodeApi();
  let currentChallenge = '';

  document.getElementById('genVerifier').addEventListener('click', () => {
    vscode.postMessage({ type: 'generateVerifier' });
  });
  document.getElementById('buildUrl').addEventListener('click', () => {
    vscode.postMessage({
      type: 'buildUrl',
      authorizeEndpoint: document.getElementById('endpoint').value,
      clientId: document.getElementById('clientId').value,
      redirectUri: document.getElementById('redirectUri').value,
      scope: document.getElementById('scope').value,
      state: document.getElementById('state').value,
      codeChallenge: currentChallenge,
    });
  });
  document.getElementById('decode').addEventListener('click', () => {
    vscode.postMessage({ type: 'decode', token: document.getElementById('idToken').value });
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'verifierResult') {
      currentChallenge = msg.codeChallenge;
      document.getElementById('verifierOut').innerHTML =
        '<pre>code_verifier: ' + msg.codeVerifier + '\\ncode_challenge (S256): ' + msg.codeChallenge + '</pre>';
    } else if (msg.type === 'urlResult') {
      document.getElementById('urlOut').innerHTML = msg.error
        ? '<pre>' + msg.error + '</pre>'
        : '<pre>' + msg.url + '</pre>';
    } else if (msg.type === 'decodeResult') {
      document.getElementById('decodeOut').innerHTML = msg.error
        ? '<pre>' + msg.error + '</pre>'
        : '<pre>Header:\\n' + JSON.stringify(msg.header, null, 2) + '\\n\\nPayload:\\n' + JSON.stringify(msg.payload, null, 2) + '</pre>';
    }
  });
</script>
</body>
</html>`;
}

interface WebviewMessage {
  type: 'generateVerifier' | 'buildUrl' | 'decode';
  authorizeEndpoint?: string;
  clientId?: string;
  redirectUri?: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  token?: string;
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('oauth2OidcFlowCompanion.open', () => {
      const panel = vscode.window.createWebviewPanel('oauth2OidcFlowCompanion', 'OAuth2/OIDC Flow Companion', vscode.ViewColumn.Active, {
        enableScripts: true,
      });
      panel.webview.html = getWebviewHtml();

      panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
        if (message.type === 'generateVerifier') {
          const codeVerifier = generateCodeVerifier();
          const codeChallenge = computeCodeChallengeS256(codeVerifier);
          void panel.webview.postMessage({ type: 'verifierResult', codeVerifier, codeChallenge });
          return;
        }
        if (message.type === 'buildUrl') {
          try {
            const url = buildAuthorizationUrl({
              authorizeEndpoint: message.authorizeEndpoint ?? '',
              clientId: message.clientId ?? '',
              redirectUri: message.redirectUri ?? '',
              scope: message.scope ?? '',
              state: message.state ?? '',
              codeChallenge: message.codeChallenge ?? '',
            });
            void panel.webview.postMessage({ type: 'urlResult', url });
            // A real authorization URL was actually built -- never fires
            // on the invalid-input branch above.
            recordHit(context);
          } catch (error) {
            void panel.webview.postMessage({ type: 'urlResult', error: `Invalid input: ${(error as Error).message}` });
          }
          return;
        }
        if (message.type === 'decode') {
          try {
            const result = decodeIdToken(message.token ?? '');
            void panel.webview.postMessage({ type: 'decodeResult', header: result.header, payload: result.payload });
            // A real ID token was actually decoded -- never fires on the
            // decode-error branch below.
            recordHit(context);
          } catch (error) {
            const errorMessage = error instanceof JwtDecodeError ? error.message : String(error);
            void panel.webview.postMessage({ type: 'decodeResult', error: errorMessage });
          }
        }
      });
    }),
  );
}

export function deactivate(): void {
  // no resources to release beyond what's registered in subscriptions
}
