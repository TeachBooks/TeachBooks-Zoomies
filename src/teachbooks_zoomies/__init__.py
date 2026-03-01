import os
import json

def setup(app):
    # 1. Register Configuration Options (with defaults)
    app.add_config_value('zoomies_selector', '.bd-article img', 'html')
    app.add_config_value('zoomies_cdn_css', 'https://unpkg.com/viewerjs/dist/viewer.min.css', 'html')
    app.add_config_value('zoomies_cdn_js', 'https://unpkg.com/viewerjs/dist/viewer.min.js', 'html')
    app.add_config_value('zoomies_caption_color_light', 'var(--pst-color-text-base)', 'html')
    app.add_config_value('zoomies_caption_color_dark', 'var(--pst-color-text-base)', 'html')
    app.add_config_value('zoomies_bg_color_light', 'rgba(255, 255, 255, 0.95)', 'html')
    app.add_config_value('zoomies_bg_color_dark', '#333', 'html')
    app.add_config_value('zoomies_toolbar', ["zoomIn", "zoomOut", "oneToOne", "reset"], 'html')
    app.add_config_value('zoomies_best_fit', 70, 'html')

    # 2. Hook: Inject assets into the HTML
    app.connect('builder-inited', on_builder_inited)
    app.connect('html-page-context', inject_assets)
    
    return {
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }

def on_builder_inited(app):
    """Register the static directory so its files are copied to the build output."""
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    if static_dir not in app.config.html_static_path:
        app.config.html_static_path.append(static_dir)

def inject_assets(app, pagename, templatename, context, doctree):
    # A. Inject CDN Links
    app.add_css_file(app.config.zoomies_cdn_css)
    app.add_js_file(app.config.zoomies_cdn_js)

    # B. Inject Configuration Variable
    config = {
        "selector": app.config.zoomies_selector,
        "toolbar": app.config.zoomies_toolbar,
        "bestFit": app.config.zoomies_best_fit
    }
    app.add_js_file(None, body=f"window.ViewerConfig = {json.dumps(config)};")

    # C. Inject Theme Colors as CSS Variables
    # We define the logic here and the mapping in the CSS file.
    
    # Defaults/Light mode
    backdrop_bg_light = app.config.zoomies_bg_color_light
    
    # Dark mode
    backdrop_bg_dark = app.config.zoomies_bg_color_dark

    img_padding = "0"
    img_rounded = "0"

    style = f"""
    :root {{
        --zoomies-caption-color: {app.config.zoomies_caption_color_light};
        --zoomies-backdrop-bg: {backdrop_bg_light};
        --zoomies-img-padding: {img_padding};
        --zoomies-img-rounded: {img_rounded};
    }}

    /* Robust dark mode detection */
    @media (prefers-color-scheme: dark) {{
        :root {{
            --zoomies-caption-color: {app.config.zoomies_caption_color_dark};
            --zoomies-backdrop-bg: {backdrop_bg_dark};
        }}
    }}

    html[data-theme="dark"], body[data-theme="dark"], [data-theme="dark"], .theme-dark, .dark {{
        --zoomies-caption-color: {app.config.zoomies_caption_color_dark} !important;
        --zoomies-backdrop-bg: {backdrop_bg_dark} !important;
    }}

    html[data-theme="light"], body[data-theme="light"], [data-theme="light"], .theme-light, .light {{
        --zoomies-caption-color: {app.config.zoomies_caption_color_light} !important;
        --zoomies-backdrop-bg: {backdrop_bg_light} !important;
    }}
    """
    
    app.add_js_file(None, body=f"const style = document.createElement('style'); style.textContent = `{style}`; document.head.appendChild(style);")

    # D. Inject our Custom Logic and Styles
    app.add_css_file('viewer_custom.css')
    app.add_js_file('viewer_custom.js')
