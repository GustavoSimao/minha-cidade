import { describe, expect, it } from "vitest";

import { Identifier } from "./identifier";
import { ValueObject } from "./value-object";
import { fail, ok } from "./result";

class UserId extends Identifier<string> {}

class Email extends ValueObject<{ address: string }> {
  public static create(address: string): Email {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      throw new Error("Email inválido");
    }
    return new Email({ address: address.toLowerCase() });
  }

  public get address(): string {
    return this.props.address;
  }

  protected equalsTo(other: { address: string }): boolean {
    return this.props.address === other.address;
  }
}

describe("kernel DDD", () => {
  it("compara Identifier por valor", () => {
    expect(new UserId("abc").equals(new UserId("abc"))).toBe(true);
    expect(new UserId("abc").equals(new UserId("xyz"))).toBe(false);
  });

  it("compara Value Object por valor e rejeita tipos diferentes", () => {
    const a = Email.create("Pessoa@Example.com");
    const b = Email.create("pessoa@example.com");

    expect(a.equals(b)).toBe(true);
    expect(a.address).toBe("pessoa@example.com");
    expect(a.equals(null)).toBe(false);
    expect(a.equals({} as never)).toBe(false);
  });

  it("rejeita email inválido na criação do Value Object", () => {
    expect(() => Email.create("nao-e-email")).toThrow("Email inválido");
  });

  it("representa sucesso e falha em Result", () => {
    const success = ok(42);
    const failure = fail<string>("invariante violada");

    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);

    if (success.ok) {
      expect(success.value).toBe(42);
    }

    if (!failure.ok) {
      expect(failure.error).toBe("invariante violada");
    }
  });
});
