import { use } from "react";

export default function UserPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params)
    const username = resolvedParams.username

    return (
        <div>
            <h1>
                {username}
            </h1>
        </div>
    )

}