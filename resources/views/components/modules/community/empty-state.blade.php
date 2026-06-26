<div class="bg-white rounded-xl border border-dashed border-gray-200 py-14 flex flex-col items-center text-center gap-3 mt-3">
    <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if($icon === 'document-text')
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            @elseif($icon === 'calendar')
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            @elseif($icon === 'heart')
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            @endif
        </svg>
    </div>
    <div>
        <p class="text-sm font-semibold text-gray-700">{{ $title }}</p>
        <p class="text-sm text-gray-400 mt-0.5">{{ $description }}</p>
    </div>
</div>