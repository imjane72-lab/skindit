"use client"

import { useEffect, useState } from "react"

interface SwaggerPath {
  [method: string]: {
    tags?: string[]
    summary?: string
    description?: string
    parameters?: Array<{ name: string; in: string; schema: { type: string } }>
    requestBody?: { content: { "application/json": { schema: { $ref?: string } } } }
    responses?: { [code: string]: { description: string } }
    security?: Array<{ [key: string]: string[] }>
  }
}

interface SwaggerSpec {
  info: { title: string; version: string; description: string }
  tags?: Array<{ name: string; description: string }>
  paths: { [path: string]: SwaggerPath }
}

const METHOD_COLORS: Record<string, string> = {
  get: "bg-blue-500",
  post: "bg-emerald-500",
  put: "bg-amber-500",
  delete: "bg-rose-500",
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<SwaggerSpec | null>(null)
  const [openPath, setOpenPath] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/swagger").then(r => r.json()).then(setSpec)
  }, [])

  if (!spec) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-500 rounded-full" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <a href="/" className="flex items-baseline gap-0.5 no-underline">
              <span className="font-display text-xl font-extrabold text-gray-900">skin</span>
              <span className="font-accent text-xl font-semibold italic text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-pink-500">dit</span>
            </a>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">API v{spec.info.version}</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">API Documentation</h1>
          <p className="text-sm text-gray-500">{spec.info.description}</p>
        </div>

        {/* Tags */}
        {spec.tags && (
          <div className="flex flex-wrap gap-2 mb-8">
            {spec.tags.map(tag => (
              <span key={tag.name} className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                {tag.name} <span className="text-gray-400 ml-1">{tag.description}</span>
              </span>
            ))}
          </div>
        )}

        {/* Endpoints */}
        <div className="flex flex-col gap-3">
          {Object.entries(spec.paths).map(([path, methods]) =>
            Object.entries(methods).map(([method, detail]) => {
              const key = `${method}-${path}`
              const isOpen = openPath === key
              return (
                <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenPath(isOpen ? null : key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left bg-transparent border-none"
                  >
                    <span className={`${METHOD_COLORS[method] || "bg-gray-500"} text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md min-w-[52px] text-center`}>
                      {method}
                    </span>
                    <code className="text-sm font-semibold text-gray-800 flex-1">{path}</code>
                    <span className="text-xs text-gray-400">{detail.summary}</span>
                    {detail.security && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">AUTH</span>}
                    <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""}`}>
                      <polyline points="2,4 6,8 10,4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 border-t border-gray-100">
                      {detail.description && <p className="text-sm text-gray-500 mt-3 mb-3">{detail.description}</p>}
                      {detail.parameters && (
                        <div className="mb-3">
                          <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Parameters</p>
                          {detail.parameters.map(p => (
                            <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
                              <code className="font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{p.name}</code>
                              <span className="text-gray-400">{p.in}</span>
                              <span className="text-gray-400">{p.schema.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Responses</p>
                        {detail.responses && Object.entries(detail.responses).map(([code, res]) => (
                          <div key={code} className="flex items-center gap-2 text-xs mb-1">
                            <span className={`font-bold ${code.startsWith("2") ? "text-emerald-600" : code.startsWith("4") ? "text-rose-600" : "text-gray-600"}`}>{code}</span>
                            <span className="text-gray-500">{res.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
