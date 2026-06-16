"""
Unit tests pinning the password-hashing algorithm.

`User.set_password` must produce a `scrypt`-prefixed hash so the algorithm
is explicit and reproducible across Werkzeug/Python versions, instead of
silently following the library default. `check_password` must still verify
correctly (round-trip), and must also verify a legacy `pbkdf2:sha256` hash
(backward compatibility — old rows in the DB may use a different method).
"""
from werkzeug.security import generate_password_hash

from app.models import User


_SAMPLE_PASSWORD = 'S0me-Str0ng-Passw0rd!'


def test_set_password_pins_scrypt_method():
    """New hashes MUST be scrypt, pinned explicitly (not left to the
    Werkzeug default which can drift across versions)."""
    user = User()
    user.set_password(_SAMPLE_PASSWORD)

    assert user.password_hash is not None
    assert user.password_hash.startswith('scrypt:'), (
        'expected an explicitly-pinned scrypt hash; got prefix '
        f'{user.password_hash.split("$", 1)[0]!r}'
    )


def test_check_password_round_trip():
    """A freshly-set password verifies true; a wrong password verifies
    false."""
    user = User()
    user.set_password(_SAMPLE_PASSWORD)

    assert user.check_password(_SAMPLE_PASSWORD) is True
    assert user.check_password('not-the-password') is False


def test_check_password_verifies_legacy_pbkdf2_hash():
    """Backward compatibility: a hash stored under the old default
    (pbkdf2:sha256) MUST still verify, because check_password_hash reads
    the algorithm from the stored hash string."""
    user = User()
    user.password_hash = generate_password_hash(
        _SAMPLE_PASSWORD, method='pbkdf2:sha256'
    )

    assert user.check_password(_SAMPLE_PASSWORD) is True
    assert user.check_password('wrong') is False
