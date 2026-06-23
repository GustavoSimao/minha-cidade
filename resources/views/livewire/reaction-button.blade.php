<div class="flex items-center gap-2">
    {{-- Apoio --}}
    <button
        wire:click="react('support')"
        class="
            flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all duration-150
            @if($userReaction === 'support')
                bg-brand-600 text-white border-brand-600 shadow-sm
            @else
                text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50
            @endif
        "
        aria-label="Apoiar publicação"
        wire:loading.attr="disabled"
    >
        <svg class="w-4 h-4" fill="{{ $userReaction === 'support' ? 'currentColor' : 'none' }}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
        </svg>
        <span>{{ $supportCount }}</span>
        <span class="hidden sm:inline">apoio{{ $supportCount !== 1 ? 's' : '' }}</span>
    </button>

    {{-- Não apoio --}}
    <button
        wire:click="react('oppose')"
        class="
            flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all duration-150
            @if($userReaction === 'oppose')
                bg-red-600 text-white border-red-600 shadow-sm
            @else
                text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50
            @endif
        "
        aria-label="Não apoiar publicação"
        wire:loading.attr="disabled"
    >
        <svg class="w-4 h-4 rotate-180" fill="{{ $userReaction === 'oppose' ? 'currentColor' : 'none' }}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
        </svg>
        @if($opposeCount > 0)
            <span>{{ $opposeCount }}</span>
        @endif
    </button>
</div>
