import { describe, expect, it } from "vitest";

import { FullName } from "./full-name";
import { Profile, ProfileId } from "./profile";
import { Role } from "./role";
import { Username } from "./username";
import { VerifiedOrg } from "./verified-org";

const acceptedAt = new Date("2026-01-01T00:00:00.000Z");

describe("Username (I2, I3)", () => {
  it("normaliza nome completo para slug", () => {
    expect(Username.fromName("Ana Maria Silva").value).toBe("ana-maria-silva");
  });

  it("remove acentos e pontuação", () => {
    expect(Username.fromName("João Vítor (Silva)!").value).toBe("joao-vitor-silva");
  });

  it("usa fallback quando a normalização resulta em vazio", () => {
    const username = Username.fromName("中文");
    expect(username.value).toMatch(/^usuario-[a-z0-9]{8}$/);
  });

  it("usa fallback para string vazia", () => {
    expect(Username.fromName("   ").value).toMatch(/^usuario-[a-z0-9]{8}$/);
  });

  it("gera fallbacks distintos", () => {
    const a = Username.fromName("!!!").value;
    const b = Username.fromName("@@@").value;
    expect(a).not.toBe(b);
  });

  it("rejeita username com caractere inválido", () => {
    expect(() => Username.create("Ana Silva")).toThrow("username inválido");
  });
});

describe("Role (I4)", () => {
  it("aceita os três papéis", () => {
    expect(Role.create("user").name).toBe("user");
    expect(Role.create("moderator").canModerate()).toBe(true);
    expect(Role.create("admin").canModerate()).toBe(true);
    expect(Role.create("user").canModerate()).toBe(false);
  });

  it("rejeita papel fora do enum", () => {
    expect(() => Role.create("dono")).toThrow("papel inválido");
  });
});

describe("VerifiedOrg (I5)", () => {
  it("aceita nome entre 3 e 120 caracteres", () => {
    expect(VerifiedOrg.create(" Prefeitura de Cariacica ").name).toBe(
      "Prefeitura de Cariacica",
    );
  });

  it("rejeita nome curto", () => {
    expect(() => VerifiedOrg.create("PF")).toThrow("entre 3 e 120");
  });
});

describe("FullName", () => {
  it("faz trim e colapsa espaços", () => {
    expect(FullName.create("  Ana   Maria ").value).toBe("Ana Maria");
  });

  it("rejeita nome curto", () => {
    expect(() => FullName.create("A")).toThrow("entre 2 e 120");
  });
});

describe("Profile", () => {
  it("cria perfil com username gerado do nome e papel user", () => {
    const profile = Profile.create({
      id: new ProfileId("11111111-1111-1111-1111-111111111111"),
      name: "Ana Maria Silva",
      termsAcceptedAt: acceptedAt,
    });

    expect(profile.username.value).toBe("ana-maria-silva");
    expect(profile.role.name).toBe("user");
    expect(profile.isVerified).toBe(false);
    expect(profile.verifiedOrg).toBeNull();
    expect(profile.cityId).toBeNull();
  });

  it("reconstrói perfil persistido com selo institucional", () => {
    const profile = Profile.rehydrate({
      id: "22222222-2222-2222-2222-222222222222",
      username: "prefeitura-cariacica",
      fullName: "Prefeitura de Cariacica",
      bio: "Canal oficial",
      phone: null,
      avatarPath: null,
      coverPath: null,
      role: "admin",
      verifiedOrg: "Prefeitura de Cariacica",
      cityId: 3201309,
      neighborhoodId: null,
      termosAceitosEm: acceptedAt,
    } as never);

    expect(profile.isVerified).toBe(true);
    expect(profile.verifiedOrg?.name).toBe("Prefeitura de Cariacica");
    expect(profile.role.name).toBe("admin");
  });

  it("projeta o perfil público sem telefone (I7)", () => {
    const profile = Profile.create({
      id: new ProfileId("33333333-3333-3333-3333-333333333333"),
      name: "Bruno Costa",
      termsAcceptedAt: acceptedAt,
    });

    profile.updateEditableFields({
      fullName: "Bruno Costa",
      bio: "Morador do Flexal",
      phone: "27999999999",
      avatarPath: null,
      coverPath: null,
      cityId: 3201309,
      neighborhoodId: null,
    });

    const publicView = profile.toPublicView(new Date("2026-02-01T00:00:00.000Z"));

    expect(publicView).toMatchObject({
      username: "bruno-costa",
      fullName: "Bruno Costa",
      bio: "Morador do Flexal",
      cityId: 3201309,
    });
    expect(publicView).not.toHaveProperty("phone");
    expect(Object.keys(publicView)).not.toContain("email");
  });

  it("não altera username nem papel ao atualizar campos editáveis (I2/I4)", () => {
    const profile = Profile.create({
      id: new ProfileId("44444444-4444-4444-4444-444444444444"),
      name: "Carla Dias",
      termsAcceptedAt: acceptedAt,
    });

    profile.updateEditableFields({
      fullName: "Carla Dias Souza",
      bio: null,
      phone: null,
      avatarPath: null,
      coverPath: null,
      cityId: null,
      neighborhoodId: null,
    });

    expect(profile.username.value).toBe("carla-dias");
    expect(profile.fullName.value).toBe("Carla Dias Souza");
    expect(profile.role.name).toBe("user");
    expect(profile.pullDomainEvents().map((event) => event.eventName)).toContain(
      "identity.profile_updated",
    );
  });

  it("rejeita bairro sem cidade", () => {
    const profile = Profile.create({
      id: new ProfileId("55555555-5555-5555-5555-555555555555"),
      name: "Diego Lima",
      termsAcceptedAt: acceptedAt,
    });

    expect(() =>
      profile.updateEditableFields({
        fullName: "Diego Lima",
        bio: null,
        phone: null,
        avatarPath: null,
        coverPath: null,
        cityId: null,
        neighborhoodId: "bairro-inexistente",
      }),
    ).toThrow("cidade é obrigatória quando há bairro");
  });

  it("limpa bairro quando a cidade é removida", () => {
    const profile = Profile.rehydrate({
      id: "66666666-6666-6666-6666-666666666666",
      username: "elaine-rua",
      fullName: "Elaine Rua",
      bio: null,
      phone: null,
      avatarPath: null,
      coverPath: null,
      role: "user",
      verifiedOrg: null,
      cityId: 3201309,
      neighborhoodId: "bairro-1",
      termsAcceptedAt: acceptedAt,
    });

    profile.updateEditableFields({
      fullName: "Elaine Rua",
      bio: null,
      phone: null,
      avatarPath: null,
      coverPath: null,
      cityId: null,
      neighborhoodId: null,
    });

    expect(profile.cityId).toBeNull();
    expect(profile.neighborhoodId).toBeNull();
  });
});
