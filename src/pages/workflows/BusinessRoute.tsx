import { BusinessPage, type BusinessPageKey } from './BusinessPages'

export function BusinessRoute({ page }: { page: BusinessPageKey }) { return <BusinessPage page={page} /> }
