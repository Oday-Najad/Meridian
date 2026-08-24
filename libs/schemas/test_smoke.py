from libs.schemas import __version__


def test_package_importable() -> None:
    """Sanity check: confirms the package structure + CI pipeline actually work."""
    assert __version__ == "0.0.1"
