import type { NeonHttpDatabase } from '@neondatabase/serverless'
import { neon } from '@neondatabase/serverless'
import { Pool } from 'pg'

type SqlFunction = {
  (strings: TemplateStringsArray, ...values: any[]): Promise<any[]>
  query: (text: string, values?: any[]) => Promise<any[]>
}

function createPgSql(): SqlFunction {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const tagged = async (strings: TemplateStringsArray, ...values: any[]) => {
    let text = ''
    strings.forEach((str, i) => {
      text += str
      if (i < values.length) text += `$${i + 1}`
    })
    const result = await pool.query(text, values)
    return result.rows
  }
  tagged.query = async (text: string, values?: any[]) => {
    const result = await pool.query(text, values)
    return result.rows
  }
  return tagged
}

function createNeonSql(): SqlFunction {
  const neonSql = neon(process.env.DATABASE_URL!)
  const tagged = async (strings: TemplateStringsArray, ...values: any[]) => {
    return neonSql(strings, ...values)
  }
  tagged.query = async (text: string, values?: any[]) => {
    return neonSql(text, values)
  }
  return tagged
}

export const sql = (): SqlFunction => {
  if (process.env.NETLIFY) {
    return createNeonSql()
  }
  return createPgSql()
}
