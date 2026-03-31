import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PERSONAS } from '../src/content/personas.ts'
import { CHARACTERS } from '../src/content/characters.ts'
import { SCENARIOS } from '../src/content/scenarios.ts'
import { scenarioContent as coffeeChat } from '../src/content/scenarios/coffee-chat.ts'
import { scenarioContent as networkingEvent } from '../src/content/scenarios/networking-event.ts'
import { scenarioContent as firstDay } from '../src/content/scenarios/first-day.ts'
import { scenarioContent as interview } from '../src/content/scenarios/interview.ts'
import { scenarioContent as financeBro } from '../src/content/scenarios/finance-bro.ts'
import { scenarioContent as liberalArts } from '../src/content/scenarios/liberal-arts.ts'
import { scenarioContent as homelessCs } from '../src/content/scenarios/homeless-cs.ts'
import { scenarioContent as richerThanYou } from '../src/content/scenarios/richer-than-you.ts'
import { scenarioContent as coolerThanYou } from '../src/content/scenarios/cooler-than-you.ts'
import { scenarioContent as vcMixer } from '../src/content/scenarios/vc-mixer.ts'
import { scenarioContent as prestigeInternship } from '../src/content/scenarios/prestige-internship.ts'
import { scenarioContent as founderDinner } from '../src/content/scenarios/founder-dinner.ts'
import { scenarioContent as startupPitch } from '../src/content/scenarios/startup-pitch.ts'
import { scenarioContent as startupBillionaire } from '../src/content/scenarios/startup-billionaire.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendDataDir = path.resolve(__dirname, '../../backend/app/data/larpmaxxer')
const contentDir = path.join(backendDataDir, 'scenario-content')

const scenarioContents = [
  coffeeChat,
  networkingEvent,
  firstDay,
  interview,
  financeBro,
  liberalArts,
  homelessCs,
  richerThanYou,
  coolerThanYou,
  vcMixer,
  prestigeInternship,
  founderDinner,
  startupPitch,
  startupBillionaire,
]

async function writeJson(filePath: string, payload: unknown) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function main() {
  await mkdir(contentDir, { recursive: true })

  await writeJson(path.join(backendDataDir, 'personas.json'), PERSONAS)
  await writeJson(path.join(backendDataDir, 'characters.json'), CHARACTERS)
  await writeJson(path.join(backendDataDir, 'scenarios.json'), SCENARIOS)

  for (const content of scenarioContents) {
    await writeJson(path.join(contentDir, `${content.scenarioId}.json`), content)
  }

  console.log(`Exported ${scenarioContents.length} scenario content files to ${backendDataDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
