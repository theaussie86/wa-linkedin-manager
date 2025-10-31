#!/usr/bin/env node
/**
 * Database Migration Script
 * Phase 9: T104 - Erstelle Database Migration Scripts
 * 
 * Dieses Script führt die SQL-Migrations für Database-Optimierungen aus.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const migrationsDir = join(projectRoot, 'migrations')

// Prüfe DATABASE_URI Environment Variable
const databaseUri = process.env.DATABASE_URI || process.env.DATABASE_URL

if (!databaseUri) {
  console.error('❌ Fehler: DATABASE_URI oder DATABASE_URL Environment Variable nicht gesetzt')
  console.error('   Bitte setze die Variable in deiner .env Datei')
  process.exit(1)
}

const migrations = [
  {
    name: '001_indexes.sql',
    description: 'Database Indexes für Performance',
  },
  {
    name: '002_constraints.sql',
    description: 'Check Constraints für Datenintegrität',
  },
  {
    name: '003_foreign_keys.sql',
    description: 'Foreign Key Constraints Dokumentation',
  },
]

async function runMigration(filename, description) {
  const filePath = join(migrationsDir, filename)
  
  try {
    const sql = readFileSync(filePath, 'utf8')
    
    console.log(`\n📄 Führe Migration aus: ${filename}`)
    console.log(`   Beschreibung: ${description}`)
    
    // Führe SQL via psql aus
    // Verwende -v ON_ERROR_STOP=1 um bei Fehlern zu stoppen
    execSync(`psql "${databaseUri}" -v ON_ERROR_STOP=1`, {
      input: sql,
      stdio: 'inherit',
      encoding: 'utf8',
    })
    
    console.log(`✅ Migration erfolgreich: ${filename}`)
    return true
  } catch (error) {
    console.error(`❌ Fehler bei Migration ${filename}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starte Database Migrations...')
  console.log(`   Datenbank: ${databaseUri.replace(/:[^:@]+@/, ':****@')}`) // Verstecke Passwort
  
  let successCount = 0
  let failCount = 0
  
  for (const migration of migrations) {
    const success = await runMigration(migration.name, migration.description)
    if (success) {
      successCount++
    } else {
      failCount++
      console.error(`\n⚠️  Migration fehlgeschlagen: ${migration.name}`)
      console.error('   Die restlichen Migrations werden nicht ausgeführt.')
      break
    }
  }
  
  console.log('\n' + '='.repeat(50))
  if (failCount === 0) {
    console.log(`✅ Alle Migrations erfolgreich abgeschlossen (${successCount}/${migrations.length})`)
    process.exit(0)
  } else {
    console.log(`❌ Migrations mit Fehlern abgebrochen (${successCount}/${migrations.length} erfolgreich)`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Unerwarteter Fehler:', error)
  process.exit(1)
})

