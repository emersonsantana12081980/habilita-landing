export async function mockChatvolt(page) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@chatvolt/embeds@latest/dist/chatbox/index.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        headers: { "access-control-allow-origin": "*" },
        body: `export default { async initBubble(options) {
      window.chatvoltOptions = options;
      const element = document.createElement('section');
      element.setAttribute('role','dialog'); element.setAttribute('aria-label','Atendimento Chatvolt');
      element.hidden = true; element.style.cssText = 'position:fixed;right:16px;bottom:155px;width:280px;padding:20px;background:white;z-index:999999;border:1px solid gray';
      const root = element.attachShadow({mode:'open'});
      root.innerHTML = '<p>Atendimento Chatvolt</p><textarea aria-label="Mensagem"></textarea>';
      element.open = () => {element.hidden = false;};
      element.close = () => {element.hidden = true;};
      document.body.append(element); return element;
    }};`,
      }),
  );
}
