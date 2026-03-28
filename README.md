# TeachBooks Zoomies

A simple Sphinx extension to integrate [Viewer.js](https://github.com/fengyuanchen/viewerjs) for image zooming in Jupyter Books and Sphinx documentation.

> [!NOTE]
> This extension is based on the original [jb-zoomies](https://github.com/bonassifabio/jb1-zoomies).

## Features

- **Pinch & Zoom:** Smooth, mobile-friendly zooming for all your images.
- **Theme Integrated:** Automatically adapts to light and dark modes, using your theme's native colors.
- **Smart Captions:** Automatically pulls captions from `<figure>` elements to display them in the viewer.
- **Best-Fit Logic:** Intelligently scales images to fit your viewport (configurable).
- **Customizable Toolbar:** Choose exactly which tools (zoom, rotate, reset) are available to your readers.

## Installation

```bash
pip install teachbooks-zoomies
```

## Usage

### Jupyter Book

Add the extension to your `_config.yml`:

```yaml
sphinx:
  extra_extensions:
    - teachbooks_zoomies
```

### Sphinx

Add the extension to your `conf.py`:

```python
extensions = [
    # ...
    'teachbooks_zoomies',
]
```

## Configuration

TeachBooks Zoomies works out-of-the-box with PyData-based themes (like the Jupyter Book default), but you can fully customize it in your `_config.yml` (Jupyter Book) or `conf.py` (Sphinx).

### Options

| Option | Default | Description |
| --- | --- | --- |
| `zoomies_selector` | `".bd-article img, #pst-secondary-sidebar img"` | CSS selector for images that should be zoomable. |
| `zoomies_best_fit` | `70` | Initial zoom level as a % of the viewport (1-100). |
| `zoomies_toolbar` | `["zoomIn", "zoomOut", "oneToOne", "reset"]` | Tools to show. Options: `zoomIn`, `zoomOut`, `oneToOne`, `reset`, `prev`, `play`, `next`, `rotateLeft`, `rotateRight`, `flipHorizontal`, `flipVertical`. |
| `zoomies_bg_color_light` | `"color-mix(in srgb, var(--pst-color-background) 95%, transparent)"` | Viewer background color in light mode. |
| `zoomies_bg_color_dark` | `"color-mix(in srgb, var(--pst-color-background) 95%, transparent)"` | Viewer background color in dark mode. |
| `zoomies_caption_color_light`| `"var(--pst-color-text-base)"` | Caption text color in light mode. |
| `zoomies_caption_color_dark` | `"var(--pst-color-text-base)"` | Caption text color in dark mode. |
| `zoomies_cdn_css` | `"https://unpkg.com/viewerjs/dist/viewer.min.css"` | URL for the Viewer.js CSS file. |
| `zoomies_cdn_js` | `"https://unpkg.com/viewerjs/dist/viewer.min.js"` | URL for the Viewer.js JS file. |

### Example `_config.yml` (Jupyter Book)

```yaml
sphinx:
  config:
    zoomies_selector: ".bd-article img, #pst-secondary-sidebar img, .my-custom-image-class"
    zoomies_best_fit: 85
    zoomies_toolbar: ["zoomIn", "zoomOut", "reset", "rotateRight"]
```

### Example `conf.py` (Sphinx)

```python
zoomies_selector = ".bd-article img, #pst-secondary-sidebar img"
zoomies_best_fit = 80
```

## Disabling Zoom for Specific Images

If you want to prevent specific images from being zoomable, you can add the class `no-zoomies` to the image itself or to any of its parent containers.

### 1. In Markdown (MyST Directive)
This is the recommended way for Jupyter Books.

````markdown
```{image} path/to/image.png
:class: no-zoomies
```
````

### 2. Using an HTML Tag
If you are writing raw HTML in your documentation.

```html
<img src="path/to/image.png" class="no-zoomies">
```

### 3. Using a Parent Container
Useful for disabling zoom on a group of images at once.

```html
<div class="no-zoomies">
  ![This image won't zoom](image1.png)
  ![This one won't either](image2.png)
</div>
```