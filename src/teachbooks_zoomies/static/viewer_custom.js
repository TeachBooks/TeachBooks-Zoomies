document.addEventListener("DOMContentLoaded", function() {

    // --- 1. CONFIGURATION ---
    // Read the config injected by our Python extension
    const selector = (window.ViewerConfig && window.ViewerConfig.selector) || '.bd-article img';

    // --- 2. REUSABLE FIT LOGIC ---
    // Scales image to a configurable percentage of screen width or height (whichever fits best).
    // bottomOffset: pixels already reserved at the bottom (e.g. footer height) to exclude from
    // the available height so the image never overlaps the caption.
    function applyBestFit(viewerInstance, bottomOffset) {
        if (!viewerInstance) return;

        const img = viewerInstance.imageData;
        const container = viewerInstance.containerData;
        const bestFitPercent = (window.ViewerConfig && window.ViewerConfig.bestFit) || 70;
        const bestFitRatio = bestFitPercent / 100;

        if (img && container) {
            const naturalW = img.naturalWidth || img.width;
            const naturalH = img.naturalHeight || img.height;

            if (naturalW > 0 && naturalH > 0) {
                const availableHeight = container.height - (bottomOffset || 0);
                const widthRatio = (container.width * bestFitRatio) / naturalW;
                const heightRatio = (availableHeight * bestFitRatio) / naturalH;
                
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

            // Build caption HTML once so both title() and viewed() can use it
            let captionHTML = "";
            const fig = target.closest('figure');
            if (fig) {
                const numberEl = fig.querySelector('.caption-number');
                const textEl = fig.querySelector('.caption-text');
                const numberText = numberEl ? numberEl.innerText : "";
                const bodyHTML = textEl ? textEl.innerHTML : "";
                captionHTML = (numberText + " " + bodyHTML).trim();
            }

            // Dynamic Toolbar configuration
            const toolbarConfig = {};
            const defaultToolbar = (window.ViewerConfig && window.ViewerConfig.toolbar) || ["zoomIn", "zoomOut", "oneToOne", "reset"];
            let captionHeight = 0;
            
            defaultToolbar.forEach(tool => {
                if (tool === 'reset') {
                    toolbarConfig.reset = {
                        show: 1,
                        click: function() { applyBestFit(viewer, captionHeight); }
                    };
                } else {
                    toolbarConfig[tool] = 1;
                }
            });

            const viewer = new Viewer(target, {
                // A. CAPTION LOGIC — return plain text; HTML is injected in viewed()
                title: function (image) {
                    return captionHTML.replace(/<[^>]*>/g, '');
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
                    // Measure footer (caption + toolbar) and push the canvas up so the image
                    // never sits behind the caption area.
                    captionHeight = viewer.footer ? viewer.footer.offsetHeight : 0;
                    if (viewer.canvas && captionHeight > 0) {
                        viewer.canvas.style.bottom = captionHeight + 'px';
                    }
                    // Inject HTML caption so links are rendered as real anchors
                    if (captionHTML) {
                        const titleEl = viewer.footer && viewer.footer.querySelector('.viewer-title');
                        if (titleEl) titleEl.innerHTML = captionHTML;
                    }
                    applyBestFit(viewer, captionHeight);
                },

                hidden: function() {
                    viewer.destroy();
                }
            });

            viewer.show();
        }
    }, true);
});
