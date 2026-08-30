addEventListener("beforeunload", () => { sessionStorage.setItem("scrollPosition", window.scrollY); }); window.addEventListener("load", () => { const scrollPosition = sessionStorage.getItem("scrollPosition"); if (scrollPosition !== null) { window.scrollTo(0, Number(scrollPosition)); } });

console.log("JavaScript работает!");