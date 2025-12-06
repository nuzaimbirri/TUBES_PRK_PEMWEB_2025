document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    body.classList.add("page-transition-enter");

    setTimeout(() => {
        body.classList.remove("page-transition-enter");
    }, 600);

    // Link transisi ke halaman lain
    const links = document.querySelectorAll("a[href$='.html']");

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            const target = link.getAttribute("href");

            // Hanya animasi untuk login <-> register
            if (target.includes("login") || target.includes("register")) {
                e.preventDefault(); 

                // Animasi keluar
                body.classList.add("page-transition-exit");

                setTimeout(() => {
                    window.location.href = target;
                }, 300);
            }
        });
    });
});
