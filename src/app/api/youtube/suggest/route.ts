import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ error: 'No query provided' }, { status: 400 })
    }

    try {
        const response = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`)
        const data = await response.json()

        return NextResponse.json(data[1] || [])
    } catch (error) {
        return NextResponse.json([])
    }
}