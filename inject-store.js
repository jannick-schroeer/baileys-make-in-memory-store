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
      content += '\n// ES6 module compatibility\nif (typeof module !== "undefined" && module.exports) {\n'
      content += '  module.exports.makeInMemoryStore = exports.default;\n'
      content += '  module.exports.default = exports.default;\n'
      content += '}\n'
    }

    // Copy to final destination
    const targetFile = path.join(targetDir, fileName)
    fs.writeFileSync(targetFile, content)

    console.log(`✅ ${fileName} copied to: ${targetFile}`)
  })

  // Update Baileys main index to export makeInMemoryStore
  const baileysIndexPath = path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'lib', 'index.js')
  
  if (fs.existsSync(baileysIndexPath)) {
    console.log('📝 Updating Baileys index.js...')
    
    let indexContent = fs.readFileSync(baileysIndexPath, 'utf8')
    
    // Check if makeInMemoryStore export already exists
    if (!indexContent.includes('makeInMemoryStore')) {
      // Add makeInMemoryStore export
      const exportLines = [
        '// Added by @naanzitos/baileys-make-in-memory-store',
        'try {',
        '  const makeInMemoryStoreModule = require("./Store/make-in-memory-store");',
        '  exports.makeInMemoryStore = makeInMemoryStoreModule.makeInMemoryStore || makeInMemoryStoreModule.default;',
        '} catch (error) {',
        '  console.warn("makeInMemoryStore not available:", error.message);',
        '}'
      ].join('\n')
      
      // Add at the end of the file
      indexContent += '\n\n' + exportLines + '\n'
      
      fs.writeFileSync(baileysIndexPath, indexContent)
      console.log('✅ makeInMemoryStore export added to Baileys index.js')
    } else {
      console.log('ℹ️  makeInMemoryStore export already exists in index.js')
    }
  } else {
    console.log('⚠️  Baileys index.js not found, trying alternative paths...')
    
    // Try alternative paths
    const altPaths = [
      path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'index.js'),
      path.join(nodeModulesPath, '@whiskeysockets', 'baileys', 'dist', 'index.js')
    ]
    
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log(`📝 Found Baileys index at: ${altPath}`)
        let indexContent = fs.readFileSync(altPath, 'utf8')
        
        if (!indexContent.includes('makeInMemoryStore')) {
          const exportLines = [
            '// Added by @naanzitos/baileys-make-in-memory-store',
            'try {',
            '  const makeInMemoryStoreModule = require("./lib/Store/make-in-memory-store");',
            '  exports.makeInMemoryStore = makeInMemoryStoreModule.makeInMemoryStore || makeInMemoryStoreModule.default;',
            '} catch (error) {',
            '  console.warn("makeInMemoryStore not available:", error.message);',
            '}'
          ].join('\n')
          
          indexContent += '\n\n' + exportLines + '\n'
          fs.writeFileSync(altPath, indexContent)
          console.log('✅ makeInMemoryStore export added to Baileys index.js')
        }
        break
      }
    }
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
