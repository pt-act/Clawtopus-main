#!/bin/bash

# Unified Memory Integration Setup Script
# Integrates Code Voyager + SimpleMem for enhanced AI memory

set -e

echo "🧠 Setting up Unified Memory Integration..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ] || [ ! -d "src/voyager" ]; then
    echo "❌ Error: Please run this script from the code-voyager root directory"
    exit 1
fi

# Check if SimpleMem is available
if [ ! -d "SimpleMem-main" ]; then
    echo "❌ Error: SimpleMem-main directory not found"
    echo "Please ensure SimpleMem is located at: $(pwd)/SimpleMem-main"
    exit 1
fi

echo "✅ Found SimpleMem at: $(pwd)/SimpleMem-main"

# Install dependencies
echo "📦 Installing dependencies..."
if command -v uv &> /dev/null; then
    echo "Using uv for installation..."
    uv pip install -e ".[simplemem]"
else
    echo "Using pip for installation..."
    pip install -e ".[simplemem]"
fi

# Test the integration
echo "🧪 Testing unified memory integration..."
PYTHONPATH="$(pwd)/src" python examples/hexstrike_integration.py

echo ""
echo "✅ Unified Memory Integration Setup Complete!"
echo ""
echo "🚀 Quick Start:"
echo "  # Store information"
echo "  PYTHONPATH=src python -c \"from voyager.memory import create_unified_memory; m=create_unified_memory('.'); m.store('SQL injection technique with sqlmap', 'skill')\""
echo ""
echo "  # Recall information"  
echo "  PYTHONPATH=src python -c \"from voyager.memory import create_unified_memory; m=create_unified_memory('.'); print(m.recall('SQL injection'))\""
echo ""
echo "📚 Integration Features:"
echo "  ✅ Dual-layer memory (Skills + Facts)"
echo "  ✅ Automatic memory type classification"
echo "  ✅ Intelligent routing between systems"
echo "  ✅ Session finalization with dialogue compression"
echo "  ✅ Cross-system memory retrieval"
echo ""
echo "🔗 Ready for HexStrike integration!"
echo "   Copy src/voyager/memory/ to your HexStrike project"
echo "   and use create_unified_memory() in your agents"
