'use client'

import { forwardRef, useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group'

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <InputGroup className={className}>
        <InputGroupInput
          ref={ref}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOffIcon className="size-4 text-muted-foreground" />
            ) : (
              <EyeIcon className="size-4 text-muted-foreground" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
