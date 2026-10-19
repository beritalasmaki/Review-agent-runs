import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'

function PillTabs() {
  const [value, setValue] = useState('a')
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList variant="pill" label="Views">
        <TabsTrigger variant="pill" value="a" tooltip="The first view">
          First
        </TabsTrigger>
        <TabsTrigger variant="pill" value="b">
          Second
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">A</TabsContent>
      <TabsContent value="b">B</TabsContent>
    </Tabs>
  )
}

describe('Tabs, pill variant', () => {
  it('draws one sliding active-tab indicator, hidden from assistive tech', () => {
    const { container } = render(<PillTabs />)
    const indicator = container.querySelector('.t-tabs-pill')
    expect(indicator).not.toBeNull()
    expect(indicator).toHaveAttribute('aria-hidden')
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it("shows a tab's tooltip on keyboard focus, as its description, and Escape hides it", async () => {
    const user = userEvent.setup()
    render(<PillTabs />)
    const tab = screen.getByRole('tab', { name: 'First' })
    await user.tab()
    expect(tab).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('The first view')
    expect(tab).toHaveAccessibleDescription('The first view')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    expect(tab).toHaveFocus()
  })

  it('line variant: a real tab list whose selected tab is marked', async () => {
    function Line() {
      const [value, setValue] = useState('a')
      return (
        <Tabs value={value} onValueChange={setValue}>
          <TabsList variant="line" label="Run types">
            <TabsTrigger variant="line" value="a">
              Pending
            </TabsTrigger>
            <TabsTrigger variant="line" value="b">
              Approved
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )
    }
    render(<Line />)
    expect(screen.getByRole('tablist', { name: 'Run types' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Approved' }))
    expect(screen.getByRole('tab', { name: 'Approved' })).toHaveAttribute('aria-selected', 'true')
  })
})
