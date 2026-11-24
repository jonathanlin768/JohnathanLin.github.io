const root = document.documentElement;
const themeControl = document.querySelector('[data-theme-control]');

if (themeControl) {
  const options = [...themeControl.querySelectorAll('[data-theme-option]')];
  const summary = themeControl.querySelector('summary');

  function selectTheme(theme) {
    for (const option of options) {
      option.setAttribute('aria-pressed', String(option.dataset.themeOption === theme));
    }
  }

  selectTheme(root.dataset.theme || 'system');
  themeControl.hidden = false;

  for (const option of options) {
    option.addEventListener('click', () => {
      const theme = option.dataset.themeOption;
      if (theme === 'system') {
        delete root.dataset.theme;
      } else {
        root.dataset.theme = theme;
      }

      try {
        if (theme === 'system') {
          localStorage.removeItem('pref-theme');
        } else {
          localStorage.setItem('pref-theme', theme);
        }
      } catch {}

      selectTheme(theme);
      themeControl.open = false;
      summary.focus();
    });
  }
}

const disclosures = document.querySelectorAll('.site-disclosure');
for (const disclosure of disclosures) {
  disclosure.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && disclosure.open) {
      event.stopPropagation();
      disclosure.open = false;
      disclosure.querySelector('summary').focus();
    }
  });
}

document.addEventListener('click', (event) => {
  for (const disclosure of disclosures) {
    if (disclosure.open && !disclosure.contains(event.target)) {
      disclosure.open = false;
    }
  }
});

const toc = document.querySelector('.post-contents-panel details');
if (toc && !window.matchMedia('(min-width: 72rem)').matches) {
  toc.open = false;
}

const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  const updateBackToTop = () => {
    backToTop.hidden = window.scrollY <= 800;
  };
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
}

const { copyCode, codeCopied } = document.body.dataset;
if (copyCode) {
  for (const code of document.querySelectorAll('.post-content pre > code')) {
    if (code.closest('.lntd:first-child')) continue;

    const pre = code.parentElement;
    let container = pre.closest('.highlight');
    if (!container || container.tagName === 'TABLE') {
      container = document.createElement('div');
      pre.before(container);
      container.append(pre);
    }
    container.classList.add('code-with-copy');

    const button = document.createElement('button');
    button.className = 'code-copy';
    button.type = 'button';
    button.textContent = copyCode;
    button.setAttribute('aria-live', 'polite');
    container.append(button);

    let feedbackTimer;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          if (!document.execCommand('copy')) return;
        } finally {
          selection.removeAllRanges();
        }
      }

      button.textContent = codeCopied;
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => { button.textContent = copyCode; }, 2000);
    });
  }
}
