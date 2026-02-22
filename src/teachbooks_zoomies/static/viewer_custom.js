document.addEventListener("DOMContentLoaded", function() {

    // --- 1. CONFIGURATION ---
    // Read the config injected by our Python extension
    const selector = (window.ViewerConfig && window.ViewerConfig.selector) || '.bd-article img';

    // --- 2. REUSABLE FIT LOGIC ---
    // Scales image to a configurable percentage of screen width or height (whichever fits best)
    function applyBestFit(viewerInstance) {
        if (!viewerInstance) return;

        const img = viewerInstance.imageData;
        const container = viewerInstance.containerData;
        const bestFitPercent = (window.ViewerConfig && window.ViewerConfig.bestFit) || 70;
        const bestFitRatio = bestFitPercent / 100;

        if (img && container) {
            const naturalW = img.naturalWidth || img.width;
            const naturalH = img.naturalHeight || img.height;

            if (naturalW > 0 && naturalH > 0) {
                const widthRatio = (container.width * bestFitRatio) / naturalW;
                const heightRatio = (container.height * bestFitRatio) / naturalH;
                
                // "Contain" logic: ensure entire image fits within the specified percentage of viewport
                const fitRatio = Math.min(widthRatio, heightRatio); 
                
                viewerInstance.zoomTo(fitRatio);
            }
        }
    }

    // --- 3. MAIN CLICK HANDLER ---
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest(selector);

        if (target) {
            e.preventDefault();
            e.stopPropagation();

            // Dynamic Toolbar configuration
            const toolbarConfig = {};
            const defaultToolbar = (window.ViewerConfig && window.ViewerConfig.toolbar) || ["zoomIn", "zoomOut", "oneToOne", "reset"];
            
            defaultToolbar.forEach(tool => {
                if (tool === 'reset') {
                    toolbarConfig.reset = {
                        show: 1,
                        click: function() { applyBestFit(viewer); }
                    };
                } else {
                    toolbarConfig[tool] = 1;
                }
            });

            const viewer = new Viewer(target, {
                // A. CAPTION LOGIC
                title: function (image) {
                    const figure = target.closest('figure');
                    if (figure) {
                        const numberEl = figure.querySelector('.caption-number');
                        const textEl = figure.querySelector('.caption-text');
                        const numberText = numberEl ? numberEl.innerText : "";
                        const bodyText = textEl ? textEl.innerText : "";
                        const fullCaption = (numberText + " " + bodyText).trim();
                        if (fullCaption.length > 0) return fullCaption;
                    }
                    return ""; 
                },

                // B. TOOLBAR
                toolbar: toolbarConfig,
                
                navbar: false,
                tooltip: false,
                backdrop: true,
                maxZoomRatio: 100,
                movable: true,
                inline: false,

                // C. INITIAL ZOOM
                viewed() {
                    applyBestFit(viewer);
                },

                hidden: function() {
                    viewer.destroy();
                }
            });

            viewer.show();
        }
    }, true);
});
