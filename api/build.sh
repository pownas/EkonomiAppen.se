#!/bin/bash

# Build script för self-contained .NET API

echo "Building self-contained .NET API..."

# Restore dependencies
dotnet restore

# Publicera för Linux (x64)
echo "Publishing for Linux x64..."
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish/linux-x64

# Publicera för Windows (x64) - om du behöver
# echo "Publishing for Windows x64..."
# dotnet publish -c Release -r win-x64 --self-contained true -o ./publish/win-x64

echo "Build complete! Binary location:"
echo "  Linux: ./publish/linux-x64/EkonomiAppenApi"
echo ""
echo "To run:"
echo "  cd publish/linux-x64"
echo "  ./EkonomiAppenApi"
