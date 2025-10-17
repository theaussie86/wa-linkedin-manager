#!/usr/bin/env node

import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './test.env' })

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🔄 Verbinde mit der Datenbank über den Pooler...')
    console.log('📍 Connection String:', process.env.DATABASE_URI.replace(/:[^:@]*@/, ':***@'))

    await client.connect()
    console.log('✅ Erfolgreich mit der Datenbank verbunden!')

    // Teste eine einfache Abfrage
    const result = await client.query('SELECT version(), current_database(), current_user')
    console.log('📊 Datenbank-Informationen:')
    console.log(
      '   Version:',
      result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
    )
    console.log('   Datenbank:', result.rows[0].current_database)
    console.log('   Benutzer:', result.rows[0].current_user)

    // Teste ob Payload-Tabellen existieren
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'payload_%'
    `)

    if (tablesResult.rows.length > 0) {
      console.log('📋 Gefundene Payload-Tabellen:')
      tablesResult.rows.forEach((row) => {
        console.log('   -', row.table_name)
      })
    } else {
      console.log('ℹ️  Noch keine Payload-Tabellen gefunden (normal beim ersten Start)')
    }
  } catch (error) {
    console.error('❌ Fehler bei der Datenbankverbindung:')
    console.error('   ', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Mögliche Lösungen:')
      console.log('   1. Stelle sicher, dass Docker läuft')
      console.log('   2. Starte die Services mit: docker-compose up -d')
      console.log('   3. Warte bis alle Services bereit sind')
    }
  } finally {
    await client.end()
  }
}

testConnection()
