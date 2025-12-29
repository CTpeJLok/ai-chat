import { createContext, useEffect, useState } from 'react'

import API_URL from '../constants/API'

export const OrganizationContext = createContext()

export const OrganizationProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([])
  const [organization, setOrganization] = useState(null)

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${API_URL}/organization/`)
      const data = await response.json()
      setOrganizations(() => data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const contextData = {
    fetchOrganizations,
    organizations,
    organization,
    setOrganization,
  }

  return (
    <OrganizationContext.Provider value={contextData}>
      {children}
    </OrganizationContext.Provider>
  )
}
