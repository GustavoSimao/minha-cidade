<div>
    @if($status === 'none')
        <button
            wire:click="sendRequest"
            class="inline-flex items-center gap-2 text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Adicionar amigo
        </button>

    @elseif($status === 'pending_sent')
        <button
            wire:click="cancelRequest"
            class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Solicitação enviada
        </button>

    @elseif($status === 'pending_received')
        <div class="flex items-center gap-2">
            <button
                wire:click="acceptRequest"
                class="inline-flex items-center gap-1.5 text-sm font-medium bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
                Aceitar
            </button>
            <button
                wire:click="cancelRequest"
                class="text-sm font-medium text-gray-500 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
                Recusar
            </button>
        </div>

    @elseif($status === 'friends')
        <button
            wire:click="unfriend"
            wire:confirm="Tem certeza que quer desfazer a amizade?"
            class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Amigos
        </button>
    @endif
</div>
