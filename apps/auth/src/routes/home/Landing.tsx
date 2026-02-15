import { Link } from 'react-router-dom'
import { Plug, Database, Zap } from 'lucide-react'

import { ExampleCard } from '../../components/ExampleCard.js'
import '../../styles/structure.scss'

export const Landing = () => {
  return (
    <div className="landing-hero">
      <h1>Massivoto integrations</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 max-w-4xl mx-auto">
        <ExampleCard
          title="Connect"
          description="Manage your integrations in one place"
          icon={Plug}
        />
        <ExampleCard
          title="Store"
          description="All data stored locally with IndexedDB"
          icon={Database}
        />
        <ExampleCard title="Fast" description="Quick access to all your tools" icon={Zap} />
      </div>
      <Link to="/dashboard" className="btn btn-primary btn-lg">
        Dashboard
      </Link>
    </div>
  )
}
