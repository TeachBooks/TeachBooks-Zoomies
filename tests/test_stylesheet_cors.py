import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock

from teachbooks_zoomies import inject_assets


class TestStylesheetCors(unittest.TestCase):
    def test_viewer_stylesheet_is_requested_with_anonymous_cors(self):
        app = MagicMock()
        app.config = SimpleNamespace(
            zoomies_cdn_css='https://unpkg.com/viewerjs/dist/viewer.min.css',
            zoomies_cdn_js='https://unpkg.com/viewerjs/dist/viewer.min.js',
            zoomies_selector='.bd-article img',
            zoomies_toolbar=['zoomIn'],
            zoomies_best_fit=70,
            zoomies_caption_color_light='black',
            zoomies_caption_color_dark='white',
            zoomies_bg_color_light='white',
            zoomies_bg_color_dark='black',
        )

        inject_assets(app, '', '', {}, None)

        app.add_css_file.assert_any_call(
            'https://unpkg.com/viewerjs/dist/viewer.min.css',
            crossorigin='anonymous',
        )


if __name__ == '__main__':
    unittest.main()
