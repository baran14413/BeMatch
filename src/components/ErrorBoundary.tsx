import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    background: '#0a0a0f',
                    color: '#ef4444',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'auto',
                    boxSizing: 'border-box'
                }}>
                    <h2>Bir Hata Oluştu! (Özel Hata Yakalayıcı)</h2>
                    <p style={{ color: '#fff' }}>Uygulama beklenmedik bir şekilde çöktü. Lütfen aşağıdaki hatayı ekran görüntüsü alıp paylaşın:</p>
                    <pre style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '20px',
                        borderRadius: '12px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        marginTop: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                        {this.state.error?.toString()}
                        {'\n'}
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </div>
            )
        }

        return this.props.children
    }
}
