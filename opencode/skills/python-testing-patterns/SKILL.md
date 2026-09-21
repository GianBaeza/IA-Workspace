---
name: python-testing-patterns
description: Comprehensive pytest patterns - fixtures, mocking, parametrize, async, TDD, coverage, database testing
---

# Python Testing Patterns

Comprehensive pytest guide for production-quality Python testing.

## Fixtures

```python
import pytest

# Function scope (default)
@pytest.fixture
def user():
    return {"id": 1, "name": "Test User", "email": "test@example.com"}

# Yield fixture (setup/teardown)
@pytest.fixture
def db_connection():
    conn = create_connection()
    yield conn
    conn.close()

# Session scope (expensive setup)
@pytest.fixture(scope="session")
def test_database():
    db = setup_test_database()
    yield db
    teardown_test_database()

# Autouse (applies to all tests in scope)
@pytest.fixture(autouse=True)
def reset_environment():
    os.environ["ENV"] = "test"
    yield
    os.environ.pop("ENV", None)
```

## Parameterization

```python
@pytest.mark.parametrize("input,expected", [
    ("hello", "HELLO"),
    ("world", "WORLD"),
    ("", ""),
    ("123", "123"),
])
def test_uppercase(input, expected):
    assert input.upper() == expected

# Multiple parameters
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_addition(a, b, expected):
    assert a + b == expected
```

## Mocking

```python
from unittest.mock import Mock, patch, MagicMock

# Mock a function
@patch('myapp.services.external_api')
def test_with_mock(mock_api):
    mock_api.return_value = {"status": "ok"}
    result = call_external_service()
    assert result["status"] == "ok"
    mock_api.assert_called_once()

# Mock a class method
@patch.object(UserService, 'create_user')
def test_create_user(mock_create):
    mock_create.return_value = User(id=1, name="Test")
    user = create_user_via_api(name="Test")
    assert user.id == 1

# MagicMock for complex objects
mock_obj = MagicMock()
mock_obj.complex.method.return_value = 42

# monkeypatch (pytest native)
def test_with_env(monkeypatch):
    monkeypatch.setenv("API_KEY", "test-key")
    assert os.environ["API_KEY"] == "test-key"
```

## Async Testing

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await async_operation()
    assert result is not None

@pytest.mark.asyncio
async def test_async_with_fixture(async_client):
    response = await async_client.get("/api/users")
    assert response.status_code == 200
```

## AAA Pattern (Arrange-Act-Assert)

```python
def test_user_creation():
    # Arrange
    user_data = {"name": "John", "email": "john@example.com"}
    
    # Act
    user = UserService.create(user_data)
    
    # Assert
    assert user.name == "John"
    assert user.email == "john@example.com"
    assert user.id is not None
```

## Exception Testing

```python
def test_raises_on_invalid():
    with pytest.raises(ValueError, match="Invalid email"):
        validate_email("not-an-email")

def test_raises_with_type():
    with pytest.raises(TypeError):
        process_number("not-a-number")
```

## Markers

```python
@pytest.mark.skip(reason="Not implemented yet")
def test_not_ready():
    pass

@pytest.mark.skipif(sys.platform == "win32", reason="Unix only")
def test_unix_only():
    pass

@pytest.mark.xfail(reason="Known bug #123")
def test_known_bug():
    pass

@pytest.mark.slow
def test_performance():
    pass

# Run only slow tests: pytest -m slow
# Skip slow tests: pytest -m "not slow"
```

## Database Testing

```python
@pytest.fixture
def db_session():
    session = TestSessionLocal()
    yield session
    session.rollback()
    session.close()

@pytest.mark.django_db
def test_database_operation():
    user = User.objects.create(name="Test")
    assert User.objects.count() == 1
    assert user.name == "Test"

# factory_boy pattern
import factory

class UserFactory(factory.Factory):
    class Meta:
        model = User
    
    name = factory.Faker("name")
    email = factory.Faker("email")
    is_active = True

def test_with_factory():
    user = UserFactory()
    assert user.is_active is True
```

## Coverage

```bash
# Run with coverage
pytest --cov=myapp --cov-report=html

# Coverage requirements
pytest --cov=myapp --cov-fail-under=80
```

## conftest.py (Shared Fixtures)

```python
# tests/conftest.py
import pytest
from myapp import create_app, db as _db

@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    with app.app_context():
        yield app

@pytest.fixture(scope="function")
def db(app):
    _db.create_all()
    yield _db
    _db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def authenticated_client(client, user):
    client.login(user.email, user.password)
    return client
```

## TDD Cycle

1. **Red**: Write a failing test
2. **Green**: Write minimum code to pass
3. **Refactor**: Improve code while keeping tests green

## Best Practices

1. Test names describe behavior: `test_should_return_error_when_user_not_found`
2. One assertion per concept (but multiple assert statements OK)
3. Tests should be independent — no shared state
4. Use fixtures for setup, not test methods
5. Mock external services, not internal logic
6. Test edge cases: empty strings, None, boundaries
7. Keep tests fast — mock expensive operations
8. Use `conftest.py` for shared fixtures
