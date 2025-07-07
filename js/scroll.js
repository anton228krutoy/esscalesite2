document.addEventListener('DOMContentLoaded', () => {

    const scrollController = () => {
        const body = document.body;
        const scrollThreshold = 50;
        
        

        if (window.scrollY > scrollThreshold) {
            body.classList.add('scrolled');
        } else {
            body.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', scrollController);

    scrollController();
});