# Import the QISKit SDK
from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, QuantumProgram
from qiskit import available_backends, execute

qp = QuantumProgram()

# Create a Quantum Register with 2 qubits.
q = QuantumRegister(3)
# Create a Classical Register with 2 bits.
c = ClassicalRegister(3)
# Create a Quantum Circuit
qc = QuantumCircuit(q, c)

# Add a H gate on qubit 0, putting this qubit in superposition.
qc.h(q[0])
# Add a CX (CNOT) gate on control qubit 0 and target qubit 1, putting
# the qubits in a Bell state.
qc.cx(q[0], q[1])
# Add a Measure gate to see the state.
qc.measure(q, c)

qp.add_circuit("bell", qc)
print(qp.get_qasm("bell"))

# See a list of available local simulators
print("Local backends: ", available_backends({'local': True}))

# Compile and run the Quantum circuit on a simulator backend
#job_sim = execute(qc, "local_qasm_simulator")
sim_result = qp.execute(backend = "local_qasm_simulator")


# Show the results
print("simulation: ", sim_result)
print(sim_result.get_counts(qc))