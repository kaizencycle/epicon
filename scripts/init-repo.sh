#!/bin/bash
# Initial commit script for EPICON repository
# Run this after setting up the repository structure

set -e

echo "🛡️ EPICON Guard - Initial Repository Setup"
echo "============================================"
echo ""

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo "❌ Not in a git repository. Please run from repo root."
    exit 1
fi

echo "📝 Step 1: Checking for unstaged changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo "✅ Found changes to commit"
else
    echo "⚠️  No changes to commit"
    exit 0
fi

echo ""
echo "📝 Step 2: Adding all files..."
git add .

echo ""
echo "📝 Step 3: Creating initial commit with EPICON intent..."

# Get current timestamp
ISSUED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Calculate expiration (30 days from now)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    EXPIRES_AT=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%SZ")
else
    # Linux
    EXPIRES_AT=$(date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%SZ")
fi

# Create commit with EPICON intent
git commit -m "feat: Initialize EPICON Guard repository

EPICON INTENT PUBLICATION

ledger_id: epicon:meta:repository-init
scope: infra
mode: normal
issued_at: ${ISSUED_AT}
expires_at: ${EXPIRES_AT}

justification: |
  Initial repository setup for EPICON Guard product.
  
  CONTEXT:
  - EPICON Guard is first commercial product from Mobius Systems
  - Provides intent accountability layer for Git
  - Targets enterprise compliance and AI-human collaboration market
  
  STRUCTURE:
  - Monorepo with Turborepo for package management
  - Packages: core (validation), github-app, api, dashboard, cli
  - Documentation-first approach
  - Dogfooding EPICON in our own development (CI checks intent)
  
  DEPENDENCIES:
  - Node.js 18+ (LTS)
  - Turborepo for monorepo management
  - TypeScript for type safety
  - GitHub Actions for CI/CD
  
  TIMELINE:
  - MVP target: Q1 2026
  - Beta launch: Q2 2026
  - General availability: Q3 2026
  - Revenue target: \$1M ARR Year 1
  
counterfactuals:
  - If monorepo structure doesn't scale, split into multiple repos
  - If Turborepo causes issues, evaluate alternatives (Nx, Lerna)
  - If CI overhead is too high, optimize workflow
  - Review architecture after first 10 external contributors
  - If initial user feedback is negative, pivot approach

Cycle: C-177
Phase: EPICON Product Launch
Built by: Mobius Systems
Website: https://epicon.dev
Product of: https://mobius.systems"

echo ""
echo "✅ Initial commit created!"
echo ""
echo "📝 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Set up branch protection on GitHub"
echo "3. Deploy landing page to Vercel"
echo "4. Register epicon.dev domain"
echo "5. Enable GitHub Actions"
echo "6. Start building MVP (packages/core)"
echo ""
echo "============================================"
echo "✅ EPICON Guard repository initialized!"
echo "============================================"
echo ""
echo "🛡️ Git commits tell you WHAT changed. EPICON tells you WHY."
echo ""
