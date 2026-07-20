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
import { initialSopDocuments } from './sopData'
import type { CustomerProject, DealBaseRecord, DeliveryBatch, DeliveryTarget, Lead, Quotation, SopDocument, Supplier, UserRole } from './types'

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
  sopDocuments: SopDocument[]
  selectedLeadIds: string[]
  setRole: (role: UserRole) => void
  setLeads: (updater: StateUpdater<Lead[]>) => void
  setTargets: (updater: StateUpdater<DeliveryTarget[]>) => void
  setBatches: (updater: StateUpdater<DeliveryBatch[]>) => void
  setSuppliers: (updater: StateUpdater<Supplier[]>) => void
  setDealBaseRecords: (updater: StateUpdater<DealBaseRecord[]>) => void
  setCustomerProjects: (updater: StateUpdater<CustomerProject[]>) => void
  setQuotations: (updater: StateUpdater<Quotation[]>) => void
  setSopDocuments: (updater: StateUpdater<SopDocument[]>) => void
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
  sopDocuments: initialSopDocuments,
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
  setSopDocuments: (updater) => set((state) => ({ sopDocuments: resolveUpdater(state.sopDocuments, updater) })),
  setSelectedLeadIds: (selectedLeadIds) => set({ selectedLeadIds }),
}))
