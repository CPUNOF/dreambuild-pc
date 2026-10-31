try {
  const theme = localStorage.getItem("dreambuild-theme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
} catch {}
