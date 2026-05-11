"use client";

import { forwardRef, useState } from "react";

import { EyeIcon, EyeOffIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <InputGroup className={className}>
        <InputGroupInput
          ref={ref}
          type={visible ? "text" : "password"}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOffIcon className="text-muted-foreground size-4" />
            ) : (
              <EyeIcon className="text-muted-foreground size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
