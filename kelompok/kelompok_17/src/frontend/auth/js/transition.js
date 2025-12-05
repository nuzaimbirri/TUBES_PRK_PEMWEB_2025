// transition.js
// Animasi transisi halaman Login <-> Register

document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    // Tambahkan animasi masuk saat halaman dimuat
    body.classList.add("page-transition-enter");

    // Setelah animasi selesai, bersihkan class
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
