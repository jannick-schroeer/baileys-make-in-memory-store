const fs = require('fs')
const path = require('path')

// Function to find node_modules directory
function findNodeModules() {
  let currentDir = process.cwd()
  
  while (currentDir !== path.parse(currentDir).root) {
    const nodeModulesPath = path.join(currentDir, 'node_modules')
    if (fs.existsSync(nodeModulesPath)) {
      return nodeModulesPath
    }
    currentDir = path.dirname(currentDir)
  }
  
  throw new Error('node_modules directory not found')
}

console.log('🔧 Baileys makeInMemoryStore Fix - Injecting files...')

try {
  const nodeModulesPath = findNodeModules()
  const targetDir = path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'lib', 'Store')
  
  // Create directory if it doesn't exist
  fs.mkdirSync(targetDir, { recursive: true })
  
  // List of files to copy
  const filesToCopy = [
    'make-in-memory-store.js',
    'make-ordered-dictionary.js',
    'object-repository.js'
  ]

  filesToCopy.forEach(fileName => {
    const sourceFile = path.join(__dirname, fileName)

    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Source file not found: ${sourceFile}`)
    }

    console.log(`📁 Copying ${fileName}...`)

    // Read the file
    let content = fs.readFileSync(sourceFile, 'utf8')

    // Adjust imports for baileys context
    content = content
      .replace(/require\('\.\.\/\.\.\/'/g, 'require("../')
      .replace(/require\('\.\/'/g, 'require("./')

    // Add named export for make-in-memory-store
    if (fileName === 'make-in-memory-store.js') {
      content += '\n\n// Named export for compatibility\nexports.makeInMemoryStore = exports.default;\n'
    }

    // Copy to final destination
    const targetFile = path.join(targetDir, fileName)
    fs.writeFileSync(targetFile, content)

    console.log(`✅ ${fileName} copied to: ${targetFile}`)
  })

  // Update Baileys main index to export makeInMemoryStore
  const possibleIndexPaths = [
    path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'lib', 'index.js'),
    path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'index.js'),
    path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'dist', 'index.js')
  ]
  
  let indexUpdated = false
  
  for (const indexPath of possibleIndexPaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`📝 Found Baileys index at: ${indexPath}`)
      
      let indexContent = fs.readFileSync(indexPath, 'utf8')
      
      // Remove any existing makeInMemoryStore exports to avoid duplicates
      indexContent = indexContent.replace(/\/\/ Added by.*baileys-make-in-memory-store[\s\S]*?}\s*$/gm, '')
      
      // Check if makeInMemoryStore export already exists
      if (!indexContent.includes('exports.makeInMemoryStore')) {
        // Determine the correct require path based on index location
        let requirePath = './Store/make-in-memory-store'
        if (indexPath.includes('/lib/index.js')) {
          requirePath = './Store/make-in-memory-store'
        } else {
          requirePath = './lib/Store/make-in-memory-store'
        }
        
        // Add makeInMemoryStore export
        const exportCode = `
// Added by @naanzitos/baileys-make-in-memory-store
try {
  const makeInMemoryStoreModule = require("${requirePath}");
  exports.makeInMemoryStore = makeInMemoryStoreModule.makeInMemoryStore || makeInMemoryStoreModule.default;
} catch (error) {
  // makeInMemoryStore not available
}
`
        
        indexContent += exportCode
        fs.writeFileSync(indexPath, indexContent)
        console.log('✅ makeInMemoryStore export added to Baileys index.js')
        indexUpdated = true
        break
      } else {
        console.log('ℹ️  makeInMemoryStore export already exists in index.js')
        indexUpdated = true
        break
      }
    }
  }
  
  if (!indexUpdated) {
    console.log('⚠️  Could not find Baileys index.js to update')
  }

  console.log('\n🎉 Injection completed successfully!')
  console.log('📦 Store files are now available:')
  filesToCopy.forEach(file => console.log(`   - ${file}`))
  console.log('\n💡 You can now use:')
  console.log('   - const { makeInMemoryStore } = require("@whiskeysockets/baileys")')
  console.log('   - import { makeInMemoryStore } from "@whiskeysockets/baileys"')
  console.log('   - import pkg from "@whiskeysockets/baileys"; const { makeInMemoryStore } = pkg')

} catch (error) {
  console.error('❌ Error during injection:', error.message)
  console.error('\n🔍 Troubleshooting:')
  console.error('   1. Make sure @whiskeysockets/baileys is installed')
  console.error('   2. Try: npm install @whiskeysockets/baileys')
  console.error('   3. Then reinstall: npm uninstall @naanzitos/baileys-make-in-memory-store && npm install @naanzitos/baileys-make-in-memory-store')
  process.exit(1)
}
