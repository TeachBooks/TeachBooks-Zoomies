document.addEventListener("DOMContentLoaded", function() {

    const props_img = [
        "background",
        "border",
        "border-block",
        "border-inline",
        "border-image",
        "outline",
        "box-shadow",
        "filter",
        "opacity",
        "mix-blend-mode",
        "background-blend-mode",
        "clip-path",
        "mask",
        "transform",
        "transform-origin",
        "transform-style",
        "perspective",
        "perspective-origin",
        "backface-visibility",
        "isolation",
        "backdrop-filter",
        "cursor",
        "pointer-events",
        "user-select",
        "appearance",
        "accent-color",
        "caret-color",
        "scrollbar-color",
        "scrollbar-width"
    ];

    const props_divs = [
        // "background",
        "filter",
        "opacity",
        "mix-blend-mode",
        "background-blend-mode",
        "transform",
        "transform-origin",
        "transform-style",
        "backface-visibility",
        "isolation",
        "backdrop-filter",
    ];

    
    function extractSubset(computed, props) {
        const out = {};
        for (const p of props) {
            out[p] = computed.getPropertyValue(p);
        }
        return out;
    }

    
    // Helper: apply a subset object as inline styles
    function applySubsetInline(el, subset) {
        for (const [k, v] of Object.entries(subset)) {
            if (v && v.trim() !== "" && v !== "none") {
                el.style.setProperty(k, v);
            }
        }
    }

    // Helper: build nested wrappers from ancestor list (outermost last)
    function buildNestedFromAncestors(ancestors, leaf, props) {
        let current = leaf;
        for (const anc of ancestors) {
            const cs = getComputedStyle(anc);
            const subset = extractSubset(cs, props);
            const wrapper = document.createElement("div");
            // neutralize layout influence
            wrapper.style.margin = "0";
            wrapper.style.padding = "0";
            // no explicit width/height per your requirement
            applySubsetInline(wrapper, subset);
            wrapper.appendChild(current);
            current = wrapper;
        }
        return current;
    }

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
                    // Transfer all classes from original img to the viewer's image
                    if (viewer.image && target.classList.length > 0) {
                        Array.from(target.classList).forEach(cls => {
                            viewer.image.classList.add(cls);
                        });
                    }
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
                    
                    // Apply SAME visual subset from original image to the actual viewer image
                    const originalCS = getComputedStyle(target);
                    const originalSubset = extractSubset(originalCS, props_img);
                    applySubsetInline(viewer.image, originalSubset);

                    // Build a NESTED wrapper chain from the original ancestors
                    const ancestors = [];
                    let el = target.parentElement;
                    // Stop before <body>/<html>: their filter/transform would be
                    // double-applied since the viewer canvas is already inside them.
                    while (el && el !== document.body && el !== document.documentElement) {
                        ancestors.push(el);
                        el = el.parentElement;
                    }
                    // We want the outermost ancestor to be the outer wrapper;
                    // buildNestedFromAncestors expects ancestors in DOM order from nearest -> farthest
                    // but it wraps in that order so the last becomes the outermost—this is fine.

                    const nested = buildNestedFromAncestors(ancestors, viewer.image, props_divs);

                    // Replace viewer canvas content with our nested reconstruction
                    if (viewer.canvas) {
                        // preserve the canvas node; just replace its children
                        while (viewer.canvas.firstChild) viewer.canvas.removeChild(viewer.canvas.firstChild);
                        viewer.canvas.appendChild(nested);
                    }


                    applyBestFit(viewer, captionHeight);

                    // Re-apply body filter (e.g. high-contrast) directly to the viewer
                    // container so the effect is preserved without breaking position:fixed.
                    if (bodyFilter && bodyFilter !== 'none') {
                        viewer.viewer.style.setProperty('filter', bodyFilter, 'important');
                    }
                },

                hidden: function() {
                    document.body.style.setProperty('transition', 'none', 'important');
                    document.body.style.removeProperty('filter');
                    void document.body.offsetWidth;
                    document.body.style.removeProperty('transition');
                    viewer.destroy();
                }
            });

            // Capture body filter (e.g. high-contrast) before neutralizing it,
            // so we can re-apply it to the viewer container instead.
            const bodyFilter = window.getComputedStyle(document.body).filter;

            // CSS filter on body (e.g. high-contrast mode) creates a new containing
            // block for position:fixed elements, breaking the viewer layout.
            // Suppress the body filter transition first so there's no intermediate
            // non-none value that would still break position:fixed during the animation.
            // Inline !important beats any stylesheet !important regardless of specificity.
            document.body.style.setProperty('transition', 'none', 'important');
            document.body.style.setProperty('filter', 'none', 'important');
            void document.body.offsetWidth; // force reflow so both changes apply synchronously
            document.body.style.removeProperty('transition');

            viewer.show();
        }
    }, true);
});
