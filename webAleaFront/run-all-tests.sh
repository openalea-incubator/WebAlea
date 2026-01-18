#!/bin/bash

echo "=== Running UNIT & INTEGRATION tests (Jest) ==="
npm run test:unit
echo "UNIT tests completed."
npm run test:integration
echo "INTEGRATION tests completed."


echo ""
echo "=== Running E2E tests (Playwright) ==="
npm run test:e2e

echo ""
echo "=== ALL TESTS COMPLETED ==="


echo ""
echo "=== Generating test coverage report ==="
npm run test:coverage