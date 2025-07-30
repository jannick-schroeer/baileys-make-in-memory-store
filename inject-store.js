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

  console.log('\n🎉 Injection completed successfully!')
  console.log('📦 Store files are now available:')
  filesToCopy.forEach(file => console.log(`   - ${file}`))
  console.log('\n💡 You can now use: const { makeInMemoryStore } = require("@whiskeysockets/baileys")')

} catch (error) {
  console.error('❌ Error during injection:', error.message)
  console.error('\n🔍 Troubleshooting:')
  console.error('   1. Make sure @whiskeysockets/baileys is installed')
  console.error('   2. Try: npm install @whiskeysockets/baileys')
  console.error('   3. Then reinstall: npm uninstall baileys-make-in-memory-store && npm install baileys-make-in-memory-store')
  process.exit(1)
}
