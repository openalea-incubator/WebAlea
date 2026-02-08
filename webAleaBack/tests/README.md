# Tests

## Environment
Tests rely on Python and Coverage. Integration tests require OpenAlea to be installed.
Environment variables are loaded from `tests/.env`.

## Run Tests (from `webAleaBack/`)

### PowerShell
```powershell
$env:PYTHONPATH="$env:PYTHONPATH;$(Get-Location)"
python -m pytest
```

### Bash
```bash
export PYTHONPATH="$PYTHONPATH:$(pwd)"
python -m pytest
```

## Integration Tests
Integration tests require a conda environment with OpenAlea.

### Setup Conda Environment
Use `tests/resources/environment.yml`:
```bash
conda env create -f tests/resources/environment.yml
conda activate webalea_test_env
```

Then run the tests as above.
