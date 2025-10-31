# Helper Scripts

## Generate Password Hash

To generate a bcrypt hash for a password, you can use:

```bash
cd backend
cargo run --bin gen_password
```

Or create a simple Rust program:

```rust
use bcrypt;

fn main() {
    let password = "password123";
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();
    println!("Hash: {}", hash);
}
```

Or use an online bcrypt generator, or Python:

```python
import bcrypt
print(bcrypt.hashpw(b'password123', bcrypt.gensalt(rounds=12)).decode())
```

