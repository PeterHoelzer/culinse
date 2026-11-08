"use client";

import { Component, ReactNode } from "react";
import { Button, EmptyState } from "@/components/ui";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="px-4 py-12">
          <EmptyState
            tone="error"
            icon="alert"
            title="Something went wrong"
            text="We couldn't load this section. Please try refreshing the page."
            action={
              <Button variant="secondary" onClick={() => this.setState({ hasError: false })}>
                Try again
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
