"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface DeliveryArea {
  id: string
  name: string
  price: number
  sort_order: number
  is_active: boolean
}

const FALLBACK: DeliveryArea[] = [
  { id: "west-dammam",  name: "غرب الدمام",      price: 30, sort_order: 1, is_active: true },
  { id: "east-dammam",  name: "شرق الدمام",      price: 35, sort_order: 2, is_active: true },
  { id: "dhahran-raka", name: "الظهران الراكة",  price: 40, sort_order: 3, is_active: true },
  { id: "aziziyah",     name: "العزيزية",         price: 60, sort_order: 4, is_active: true },
  { id: "khobar",       name: "الخبر",            price: 50, sort_order: 5, is_active: true },
]

export function useDeliveryAreas() {
  const [areas, setAreas] = useState<DeliveryArea[]>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("delivery_areas")
      .select("*")
      .order("sort_order")
    if (!error && data && data.length > 0) {
      setAreas(data)
    } else {
      setAreas(FALLBACK)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return { areas: areas.filter(a => a.is_active), allAreas: areas, loading, reload: load }
}

export async function saveDeliveryArea(area: DeliveryArea): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from("delivery_areas")
    .upsert({
      id: area.id,
      name: area.name,
      price: area.price,
      sort_order: area.sort_order,
      is_active: area.is_active,
    }, { onConflict: "id" })
  return !error
}

export async function deleteDeliveryArea(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("delivery_areas").delete().eq("id", id)
  return !error
}

export async function seedDeliveryAreas(): Promise<void> {
  const supabase = createClient()
  await supabase.from("delivery_areas").upsert(
    FALLBACK.map(a => ({
      id: a.id,
      name: a.name,
      price: a.price,
      sort_order: a.sort_order,
      is_active: a.is_active,
    })),
    { onConflict: "id" }
  )
}