<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $user->name }} — Minha Cidade</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        [x-cloak] { display: none !important; }
    </style>
    @livewireStyles
</head>
<body class="bg-surface font-sans text-gray-900 antialiased">

<nav class="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
            </span>
            <span class="font-semibold text-gray-900 tracking-tight">Minha Cidade</span>
        </a>
        <div class="flex items-center gap-1 text-sm font-medium text-gray-600">
            @auth
                <a href="/dashboard" class="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">Dashboard</a>
                <a href="/perfil/{{ auth()->user()->username }}" class="px-3 py-1.5 rounded-md bg-brand-50 text-brand-700 font-semibold">Perfil</a>
            @else
                <a href="{{ route('login') }}" class="px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">Entrar</a>
                <a href="{{ route('register') }}" class="px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors">Cadastrar</a>
            @endauth
        </div>
    </div>
</nav>

<main class="max-w-5xl mx-auto px-4 pb-16">

    <div class="relative">
        <div class="h-52 sm:h-64 rounded-b-xl overflow-hidden bg-gradient-to-br from-brand-600 to-blue-400">
            @if($user->profile && $user->profile->cover_image)
                <img src="{{ $user->profile->cover_image }}" alt="Foto de capa" class="w-full h-full object-cover" />
            @else
                <svg class="w-full h-full opacity-20" viewBox="0 0 800 256" preserveAspectRatio="xMidYMid slice" fill="white">
                    <rect x="0"   y="170" width="60"  height="86"/>
                    <rect x="70"  y="130" width="50"  height="126"/>
                    <rect x="130" y="150" width="40"  height="106"/>
                    <rect x="180" y="100" width="70"  height="156"/>
                    <rect x="260" y="140" width="45"  height="116"/>
                    <rect x="315" y="110" width="55"  height="146"/>
                    <rect x="380" y="90"  width="80"  height="166"/>
                    <rect x="470" y="130" width="50"  height="126"/>
                    <rect x="530" y="155" width="40"  height="101"/>
                    <rect x="580" y="120" width="65"  height="136"/>
                    <rect x="655" y="145" width="45"  height="111"/>
                    <rect x="710" y="100" width="90"  height="156"/>
                </svg>
            @endif
        </div>

        @auth
            @if(auth()->id() === $user->id)
                <button class="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow backdrop-blur-sm transition-all">
                    Editar capa
                </button>
            @endif
        @endauth

        <div class="absolute -bottom-12 left-6">
            <div class="relative">
                <img
                    src="{{ ($user->profile && $user->profile->profile_picture) ? $user->profile->profile_picture : 'https://ui-avatars.com/api/?name='.urlencode($user->name).'&size=96&background=2563eb&color=fff' }}"
                    alt="{{ $user->name }}"
                    class="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-brand-100"
                />
                <span class="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
        </div>
    </div>

    <div class="mt-14 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-1">
        <div>
            <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-xl font-bold text-gray-900">{{ $user->name }}</h1>
                @if($user->profile && $user->profile->is_verified)
                    <span class="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-brand-100">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                        Verificado
                    </span>
                @endif
            </div>
            <p class="text-sm text-gray-500 mt-0.5">{{ ($user->profile && $user->profile->role) ? $user->profile->role : 'Membro' }}</p>
            @if($user->profile && $user->profile->bio)
                <p class="text-sm text-gray-700 mt-2 max-w-lg leading-relaxed">{{ $user->profile->bio }}</p>
            @endif
        </div>

        <div class="flex items-center gap-2 shrink-0">
            @auth
                @if(auth()->id() === $user->id)
                    <a href="{{ route('profile') }}" class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        Editar perfil
                    </a>
                @else
                    <livewire:community.friendship-button :user="$user" />
                @endif
            @endauth
        </div>
    </div>

    <div class="mt-6 grid grid-cols-4 gap-3">
        @foreach([
            ['icon'=>'users',    'value'=>$stats['friends'],       'label'=>'Amigos'],
            ['icon'=>'document', 'value'=>$stats['publications'],   'label'=>'Publicações'],
            ['icon'=>'calendar', 'value'=>$stats['events_created'], 'label'=>'Eventos criados'],
            ['icon'=>'heart',    'value'=>$stats['causes'],         'label'=>'Causas apoiadas'],
        ] as $stat)
        <div class="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col items-center gap-1 shadow-sm">
            <x-modules.identity.stat-icon :name="$stat['icon']" />
            <span class="text-2xl font-bold text-gray-900 leading-none">{{ $stat['value'] }}</span>
            <span class="text-xs text-gray-500 text-center">{{ $stat['label'] }}</span>
        </div>
        @endforeach
    </div>

    <livewire:identity.profile-tabs :user="$user" />

</main>

@livewireScripts
</body>
</html>