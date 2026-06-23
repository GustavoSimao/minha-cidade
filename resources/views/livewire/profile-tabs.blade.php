<div class="mt-6">

    {{-- Tab navigation --}}
    <div class="border-b border-gray-200 bg-white rounded-t-xl">
        <nav class="flex gap-1 px-4 pt-2" aria-label="Seções do perfil">
            @foreach([
                ['key' => 'publications', 'icon' => 'document-text',  'label' => 'Publicações'],
                ['key' => 'events',       'icon' => 'calendar',        'label' => 'Eventos'],
                ['key' => 'causes',       'icon' => 'heart',           'label' => 'Causas apoiadas'],
                ['key' => 'about',        'icon' => 'user-circle',     'label' => 'Sobre'],
            ] as $tab)
            <button
                wire:click="switchTab('{{ $tab['key'] }}')"
                class="
                    relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                    @if($activeTab === $tab['key'])
                        text-brand-600 after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-brand-600 after:rounded-full
                    @else
                        text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg
                    @endif
                "
                aria-selected="{{ $activeTab === $tab['key'] ? 'true' : 'false' }}"
            >
                <x-tab-icon :name="$tab['icon']" class="w-4 h-4" />
                {{ $tab['label'] }}
            </button>
            @endforeach
        </nav>
    </div>

    {{-- Tab content --}}
    <div class="mt-0">

        {{-- ──── PUBLICATIONS ──── --}}
        @if($activeTab === 'publications')
            <div class="space-y-3 pt-3">
                @forelse($publications as $pub)
                    <article class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-colors">
                        <div class="flex gap-4 p-4">
                            {{-- Content --}}
                            <div class="flex-1 min-w-0">
                                {{-- Type badge --}}
                                <x-publication-type-badge :type="$pub->type" />

                                <h2 class="mt-2 font-semibold text-gray-900 leading-snug text-[15px]">
                                    <a href="/publicacao/{{ $pub->id }}" class="hover:text-brand-600 transition-colors">
                                        {{ $pub->title }}
                                    </a>
                                </h2>
                                <p class="mt-1 text-sm text-gray-600 line-clamp-2">{{ $pub->body }}</p>

                                {{-- Meta --}}
                                <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                    <span>{{ $pub->created_at->diffForHumans() }}</span>
                                    <span>•</span>
                                    <span>{{ $pub->city->name }}, {{ $pub->city->state }}</span>
                                </div>

                                {{-- Reactions row --}}
                                <div class="mt-3 flex items-center gap-4">
                                    <livewire:reaction-button
                                        :publication="$pub"
                                        :key="'reactions-'.$pub->id"
                                    />
                                    <a
                                        href="/publicacao/{{ $pub->id }}#comentarios"
                                        class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                        </svg>
                                        {{ $pub->comments_count ?? 0 }} comentários
                                    </a>
                                    <button class="ml-auto text-gray-400 hover:text-gray-600 transition-colors" aria-label="Salvar">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {{-- Thumbnail (first media) --}}
                            @if($pub->media->isNotEmpty())
                                <div class="hidden sm:block shrink-0">
                                    <img
                                        src="{{ $pub->media->first()->url }}"
                                        alt=""
                                        class="w-28 h-20 object-cover rounded-lg bg-gray-100"
                                        loading="lazy"
                                    />
                                </div>
                            @endif
                        </div>
                    </article>
                @empty
                    <x-empty-state
                        icon="document-text"
                        title="Nenhuma publicação ainda"
                        description="Quando {{ $user->first_name }} publicar algo, aparece aqui."
                    />
                @endforelse

                @if($publications->hasPages())
                    <div class="pt-2">
                        {{ $publications->links() }}
                    </div>
                @endif
            </div>
        @endif

        {{-- ──── EVENTS ──── --}}
        @if($activeTab === 'events')
            <div class="space-y-3 pt-3">
                @forelse($events as $event)
                    <article class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4 hover:border-gray-300 transition-colors">
                        {{-- Date chip --}}
                        <div class="shrink-0 flex flex-col items-center bg-brand-50 text-brand-700 rounded-lg px-3 py-2 w-14 text-center">
                            <span class="text-xs font-medium uppercase tracking-wide">{{ $event->starts_at->format('M') }}</span>
                            <span class="text-2xl font-bold leading-none">{{ $event->starts_at->format('d') }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-medium px-2 py-0.5 rounded-full
                                    @if($event->modality === 'online') bg-purple-50 text-purple-700
                                    @else bg-green-50 text-green-700 @endif">
                                    {{ $event->modality === 'online' ? 'Online' : 'Presencial' }}
                                </span>
                                @if($event->is_paid)
                                    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Pago</span>
                                @endif
                            </div>
                            <h2 class="mt-1 font-semibold text-gray-900 text-[15px]">{{ $event->title }}</h2>
                            <p class="text-sm text-gray-500 mt-0.5 line-clamp-1">{{ $event->description }}</p>
                            <div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    {{ $event->starts_at->format('H:i') }}
                                </span>
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    {{ $event->participants_count }} participante{{ $event->participants_count !== 1 ? 's' : '' }}
                                    @if($event->max_participants) / {{ $event->max_participants }} @endif
                                </span>
                                <span>{{ $event->city->name }}, {{ $event->city->state }}</span>
                            </div>
                        </div>
                        <a href="/evento/{{ $event->id }}" class="shrink-0 self-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                            Ver →
                        </a>
                    </article>
                @empty
                    <x-empty-state
                        icon="calendar"
                        title="Nenhum evento criado"
                        description="{{ $user->first_name }} ainda não organizou eventos."
                    />
                @endforelse

                @if($events->hasPages())
                    <div class="pt-2">{{ $events->links() }}</div>
                @endif
            </div>
        @endif

        {{-- ──── CAUSAS APOIADAS ──── --}}
        @if($activeTab === 'causes')
            <div class="space-y-3 pt-3">
                @forelse($causes as $pub)
                    <article class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-colors">
                        <div class="flex gap-4 p-4">
                            <div class="flex-1 min-w-0">
                                <x-publication-type-badge :type="$pub->type" />
                                <h2 class="mt-2 font-semibold text-gray-900 text-[15px] leading-snug">
                                    <a href="/publicacao/{{ $pub->id }}" class="hover:text-brand-600 transition-colors">{{ $pub->title }}</a>
                                </h2>
                                <p class="mt-1 text-sm text-gray-600 line-clamp-2">{{ $pub->body }}</p>
                                <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                    <span>por {{ $pub->is_anonymous ? 'Anônimo' : $pub->author->name }}</span>
                                    <span>•</span>
                                    <span>{{ $pub->city->name }}, {{ $pub->city->state }}</span>
                                </div>
                                <div class="mt-3 flex items-center gap-1.5 text-sm text-brand-600 font-medium">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723..."/></svg>
                                    {{ $pub->support_count }} apoios
                                </div>
                            </div>
                            @if($pub->media->isNotEmpty())
                                <div class="hidden sm:block shrink-0">
                                    <img src="{{ $pub->media->first()->url }}" alt="" class="w-28 h-20 object-cover rounded-lg bg-gray-100" loading="lazy"/>
                                </div>
                            @endif
                        </div>
                    </article>
                @empty
                    <x-empty-state
                        icon="heart"
                        title="Nenhuma causa apoiada"
                        description="{{ $user->first_name }} ainda não apoiou publicações."
                    />
                @endforelse
                @if($causes->hasPages())
                    <div class="pt-2">{{ $causes->links() }}</div>
                @endif
            </div>
        @endif

        {{-- ──── SOBRE ──── --}}
        @if($activeTab === 'about')
            <div class="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                @if($user->bio)
                    <div>
                        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Sobre</h3>
                        <p class="text-sm text-gray-700 leading-relaxed">{{ $user->bio }}</p>
                    </div>
                @endif

                <div>
                    <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Informações</h3>
                    <ul class="space-y-2.5">
                        <li class="flex items-center gap-3 text-sm text-gray-700">
                            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {{ $user->city }}, {{ $user->state }}
                        </li>
                        <li class="flex items-center gap-3 text-sm text-gray-700">
                            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            Membro desde {{ $user->created_at->format('F \d\e Y') }}
                        </li>
                        @if($user->account_type !== 'user')
                            <li class="flex items-center gap-3 text-sm text-gray-700">
                                <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                {{ Str::ucfirst($user->account_type) }}
                                @if($user->is_verified)
                                    <span class="ml-1 text-xs text-brand-600 font-semibold">(Verificado)</span>
                                @endif
                            </li>
                        @endif
                    </ul>
                </div>

                {{-- Neighborhoods the user is active in --}}
                @if($user->activeNeighborhoods->isNotEmpty())
                    <div>
                        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bairros ativos</h3>
                        <div class="flex flex-wrap gap-2">
                            @foreach($user->activeNeighborhoods as $neighborhood)
                                <span class="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{{ $neighborhood->name }}</span>
                            @endforeach
                        </div>
                    </div>
                @endif
            </div>
        @endif

    </div>
</div>
