import { create } from 'zustand'
import {
  initialBatches,
  initialCustomerProjects,
  initialDealBaseRecords,
  initialLeads,
  initialQuotations,
  initialSuppliers,
  initialTargets,
} from './mockData'
import type { CustomerProject, DealBaseRecord, DeliveryBatch, DeliveryTarget, Lead, Quotation, Supplier, UserRole } from './types'

type StateUpdater<T> = T | ((previous: T) => T)

function resolveUpdater<T>(previous: T, updater: StateUpdater<T>) {
  return typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater
}

type LeadSystemStore = {
  role: UserRole
  leads: Lead[]
  targets: DeliveryTarget[]
  batches: DeliveryBatch[]
  suppliers: Supplier[]
  dealBaseRecords: DealBaseRecord[]
  customerProjects: CustomerProject[]
  quotations: Quotation[]
  selectedLeadIds: string[]
  setRole: (role: UserRole) => void
  setLeads: (updater: StateUpdater<Lead[]>) => void
  setTargets: (updater: StateUpdater<DeliveryTarget[]>) => void
  setBatches: (updater: StateUpdater<DeliveryBatch[]>) => void
  setSuppliers: (updater: StateUpdater<Supplier[]>) => void
  setDealBaseRecords: (updater: StateUpdater<DealBaseRecord[]>) => void
  setCustomerProjects: (updater: StateUpdater<CustomerProject[]>) => void
  setQuotations: (updater: StateUpdater<Quotation[]>) => void
  setSelectedLeadIds: (selectedLeadIds: string[]) => void
}

export const useLeadSystemStore = create<LeadSystemStore>((set) => ({
  role: 'admin',
  leads: initialLeads,
  targets: initialTargets,
  batches: initialBatches,
  suppliers: initialSuppliers,
  dealBaseRecords: initialDealBaseRecords,
  customerProjects: initialCustomerProjects,
  quotations: initialQuotations,
  selectedLeadIds: [],
  setRole: (role) => set({ role }),
  setLeads: (updater) => set((state) => ({ leads: resolveUpdater(state.leads, updater) })),
  setTargets: (updater) => set((state) => ({ targets: resolveUpdater(state.targets, updater) })),
  setBatches: (updater) => set((state) => ({ batches: resolveUpdater(state.batches, updater) })),
  setSuppliers: (updater) => set((state) => ({ suppliers: resolveUpdater(state.suppliers, updater) })),
  setDealBaseRecords: (updater) =>
    set((state) => ({ dealBaseRecords: resolveUpdater(state.dealBaseRecords, updater) })),
  setCustomerProjects: (updater) =>
    set((state) => ({ customerProjects: resolveUpdater(state.customerProjects, updater) })),
  setQuotations: (updater) => set((state) => ({ quotations: resolveUpdater(state.quotations, updater) })),
  setSelectedLeadIds: (selectedLeadIds) => set({ selectedLeadIds }),
}))
